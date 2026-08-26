/**
 * שכבת העיגון של „המצב הנוכחי" והכלי — retrieval-grounded / deterministic-first.
 *
 * זהו מקור-האמת ל-`currentSituation` ול-`toolSurfaced`, ומיישם את הארכיטקטורה
 * המאושרת:
 *
 *  • `toolSurfaced` נגזר *מהחומר שהאחזור באמת עיגן* ומה-dilemma המתאים — לעולם
 *    לא מה-journey. יש שער-אחזור קשיח: dilemma חייב חפיפה מינימלית עם הקטעים
 *    שנשלפו כדי להיות מועמד. אם אין התאמה בטוחה — הכלי הוא `null` (לא מנחשים).
 *
 *  • `currentSituation` נקבע deterministic-first לפי סדר האותות המאושר:
 *      1. עיגון-אחזור: ה-dilemma שנמצא מהקטעים (+ ה-Part/תחנה שלו).
 *      2. מיפוי ה-dilemma למסע (DILEMMA_JOURNEY).
 *      3. הטקסט שהמבקר כתב — אות *משני* (classifyCurrentSituation).
 *      4. `station` — prior חלש בלבד.
 *    אם אין מנצח בטוח → `null`, והשיחה ממשיכה במסלול הגנרי, בלי לכפות סיווג.
 *
 *  • Persona לעולם אינו חלק מכאן: אין ייבוא של personas, ואין ערוץ שממנו נגזרת,
 *    נקבעת או נשמרת פרסונה מ-journey/situation/free-text.
 */

import { dilemmas, type Dilemma, type AskStationId } from "@/content/askRoute";
import { methodByToolId } from "@/content/methods";
import { tokenize, expandWord } from "@/lib/compass/hebrew";
import { classifyCurrentSituation } from "@/lib/journey/classify";
import { type JourneyId, type SurfacedTool } from "@/content/journeys";
import type { CompassMatch } from "@/lib/compass/types";

/**
 * מיפוי דטרמיניסטי מ-19 ה-dilemmas הקיימים אל חמשת המסעות. חלק מה-dilemmas
 * (למשל „מתקשה להתחיל", „שחיקה מדייטים") אינם נופלים באופן נקי לאחד מחמשת
 * המצבים, ולכן נשארים *ללא מיפוי* בכוונה: הם עדיין יכולים לעגן כלי, אך לא
 * יכריעו מסע — ואז הסיווג נופל לאות-הטקסט או ל-null. אין ניחוש.
 */
export const DILEMMA_JOURNEY: Record<string, JourneyId> = {
  "d-unavailable": "recurring-pattern",
  "d-reject-fast": "recurring-pattern",
  "d-hotcold": "interpreting-signals",
  "d-words-actions": "interpreting-signals",
  "d-exclusive": "interpreting-signals",
  "d-attraction-values": "deciding-continue",
  "d-pace": "deciding-continue",
  "d-ready-return": "deciding-continue",
  "d-distance-routine": "conflict-distance",
  "d-same-fights": "conflict-distance",
  "d-emotional-gap": "conflict-distance",
  "d-ask-without-blame": "conflict-distance",
  "d-repair-avoid": "conflict-distance",
  "d-expectations": "conflict-distance",
  "d-miss-idea": "ending-letting-go",
  "d-loneliness": "ending-letting-go",
  "d-unclosed": "ending-letting-go",
  // d-start, d-burnout — ללא מיפוי מכוון (ראו הערה למעלה).
};

/** מילות-עצירה עבריות נפוצות — מוסרות מטביעות-האצבע כדי שהחפיפה תשקף תוכן. */
const STOPWORDS = new Set(
  [
    "את", "של", "על", "לא", "אני", "זה", "מה", "אם", "גם", "כי", "יש", "אבל",
    "או", "כמו", "עם", "הוא", "היא", "הם", "הן", "אתם", "אתן", "אנחנו", "יותר",
    "פחות", "כבר", "רק", "כל", "זו", "זאת", "אותו", "אותה", "להם", "לי", "לו",
    "לה", "שלי", "שלך", "שלו", "שלה", "הכי", "בין", "כדי", "אחרי", "לפני",
    "עכשיו", "משהו", "דברים", "כן", "לך", "לכם", "אין", "היה", "היו", "כשה",
    "אז", "עוד", "ואז", "ולא", "הזה", "הזאת", "שהוא", "שהיא",
    // מטא-רעש: „הספר" פותח כמעט כל distinction, ולכן אינו מבחין בין dilemmas.
    "ספר", "הספר", "לכם", "אתם",
  ].map((w) => expandWord(w)[0] ?? w),
);

/** טביעת-אצבע: קבוצת טוקנים מנורמלים (≥3 אותיות), ללא מילות-עצירה. */
function fingerprint(text: string): Set<string> {
  const out = new Set<string>();
  for (const raw of tokenize(text)) {
    for (const form of expandWord(raw)) {
      if (form.length >= 3 && !STOPWORDS.has(form)) out.add(form);
    }
  }
  return out;
}

interface DilemmaFingerprint {
  dilemma: Dilemma;
  tokens: Set<string>;
}

/** נבנה פעם אחת: טביעת-אצבע לכל dilemma מ-label + distinction + reflection + checks. */
const FINGERPRINTS: DilemmaFingerprint[] = dilemmas.map((d) => ({
  dilemma: d,
  tokens: fingerprint(
    [d.label, d.answer.distinction, d.answer.reflection, ...d.answer.checks].join(" "),
  ),
}));

function overlap(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const t of a) if (b.has(t)) n += 1;
  return n;
}

/** הכלי מ-`methods` לפי מזהה כלי-הספר של ה-dilemma. null כשאין מיפוי. */
function toolForDilemma(d: Dilemma): SurfacedTool | null {
  const toolId = d.answer.toolId;
  if (!toolId) return null;
  const method = methodByToolId[toolId];
  if (!method) return null;
  return { slug: method.path.replace(/^\/method\//, ""), path: method.path, term: method.term };
}

// ── ספי-הכרעה ────────────────────────────────────────────────────────────────
const W_RETRIEVAL = 2; // עיגון-אחזור — משקל ראשי
const W_TEXT = 1; // טקסט המבקר — משני
const STATION_BONUS = 2; // prior חלש
/** שער-אחזור קשיח: dilemma חייב לפחות כך-וכך טוקנים משותפים עם הקטעים שנשלפו. */
const RETRIEVAL_GATE = 3;
/** מרווח מהמקום השני — כדי לא להכריע כלי על תיקו רועש. */
const LEAD_MARGIN = 2;

export interface GroundInput {
  /** ההודעה הנוכחית של המבקר. */
  text: string;
  /** ההודעה הפותחת (בתור-המשך) — לעיגון עקבי עם האחזור. */
  firstUserText?: string;
  /** הקטעים שהאחזור החזיר בפועל — מקור העיגון של הכלי. */
  matches?: CompassMatch[];
  /** התחנה שנבחרה — prior חלש בלבד. */
  station?: AskStationId | null;
}

export interface Grounded {
  currentSituation: JourneyId | null;
  toolSurfaced: SurfacedTool | null;
  /** ה-dilemma שעיגן את הכלי (לתיעוד/בדיקות). */
  dilemmaId: string | null;
}

/**
 * מוצא את ה-dilemma המעוגן-אחזור, אם יש התאמה בטוחה. עובר את *שער-האחזור*
 * (חפיפה מינימלית עם הקטעים) — כלומר בלי קטעים שנשלפו לא ייבחר dilemma כלל,
 * ולכן `toolSurfaced` יהיה null. הטקסט/התחנה מוסיפים משקל אך אינם עוקפים את השער.
 */
function matchDilemma(input: GroundInput): Dilemma | null {
  const retTokens = fingerprint(
    (input.matches ?? [])
      .map((m) => `${m.chapterName} ${m.sectionName ?? ""} ${m.content}`)
      .join(" "),
  );
  if (retTokens.size === 0) return null;

  const combined = input.firstUserText ? `${input.firstUserText} ${input.text}` : input.text;
  const txtTokens = fingerprint(combined);

  let best: DilemmaFingerprint | null = null;
  let bestScore = 0;
  let bestRet = 0;
  let secondScore = 0;
  for (const fp of FINGERPRINTS) {
    const ret = overlap(retTokens, fp.tokens);
    if (ret < RETRIEVAL_GATE) continue; // שער-אחזור קשיח
    const txt = overlap(txtTokens, fp.tokens);
    const station =
      input.station && fp.dilemma.station === input.station ? STATION_BONUS : 0;
    const score = W_RETRIEVAL * ret + W_TEXT * txt + station;
    if (score > bestScore) {
      secondScore = bestScore;
      bestScore = score;
      bestRet = ret;
      best = fp;
    } else if (score > secondScore) {
      secondScore = score;
    }
  }
  if (!best || bestRet < RETRIEVAL_GATE || bestScore - secondScore < LEAD_MARGIN) {
    return null;
  }
  return best.dilemma;
}

/**
 * מעגן את המצב והכלי. `toolSurfaced` תמיד מהאחזור (או null). `currentSituation`
 * deterministic-first: dilemma מעוגן-אחזור → מיפוי למסע; ואם אין — אות-הטקסט
 * המשני; ואם גם הוא לא הכריע — null.
 */
export function groundSituation(input: GroundInput): Grounded {
  const dilemma = matchDilemma(input);
  const toolSurfaced = dilemma ? toolForDilemma(dilemma) : null;

  const dilemmaJourney = dilemma ? DILEMMA_JOURNEY[dilemma.id] ?? null : null;
  const textJourney = classifyCurrentSituation(input.text, {
    firstUserText: input.firstUserText,
  });
  const currentSituation = dilemmaJourney ?? textJourney;

  return { currentSituation, toolSurfaced, dilemmaId: dilemma?.id ?? null };
}
