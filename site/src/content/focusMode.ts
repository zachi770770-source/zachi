/**
 * Focus Mode — התוכן של חוויית „איפה זה פוגש אותך עכשיו?”.
 *
 * אין כאן תוכן חדש: כל מחרוזת מורכבת ממקורות-האמת הקיימים בלבד —
 *   • המצב (כותרת/קישור-תחנה)  ← `homePaths`
 *   • זוג עובדה/סיפור          ← `methods["fact-story"].factStory` (moments/stories)
 *   • משפט-ההפרדה (ה-Aha)      ← אותו `factStory.separationLine`
 *   • משפט-הגשר לאחר ההבנה     ← `journeyPages[...].pullQuote`
 *
 * החוויה מפעילה את כלי „עובדה, סיפור, פעולה” על כל אחד מארבעת המצבים: בוחרים
 * *מתוך* מאגרי ה-moments/stories המאושרים את הזוג הקרוב תמטית למצב. ההתאמה היא
 * בחירה עריכתית מתוך תוכן קיים — לא ניסוח חדש ולא המצאת עובדה/סיפור.
 *
 * ה-UI-chrome (תוויות, כפתורים) הוא טקסט-ממשק מסגרתי בלבד — אינו טענה, המלצה,
 * מספר או תוכן מהספר, ותואם את גבולות התוכן של טרום-ההשקה.
 */

import { homePaths, type HomePathId } from "@/content/homePaths";
import { journeyPages, type JourneyId } from "@/content/journeyPages";
import { methods } from "@/content/methods";

const lab = methods["fact-story"].factStory;
if (!lab) {
  // שמירה מפורשת: אם ה-lab יוסר אי-פעם, הכשל יהיה בזמן-בנייה ולא בזמן-ריצה.
  throw new Error("focusMode: methods['fact-story'].factStory is required");
}

/** בחירת מזהה-רגע מתוך `factStory.moments` — נכשל אם המזהה אינו קיים. */
function momentFact(id: string): string {
  const m = lab!.moments.find((x) => x.id === id);
  if (!m) throw new Error(`focusMode: unknown fact-story moment "${id}"`);
  return m.fact;
}
/** בחירת סיפור מתוך `factStory.stories` — נכשל אם אינו קיים. */
function story(text: string): string {
  if (!lab!.stories.includes(text)) {
    throw new Error(`focusMode: story not found in fact-story stories: "${text}"`);
  }
  return text;
}

export interface FocusSituation {
  /** מזהה המצב — משותף עם `homePaths` וכרטיס-המצב (shared-element). */
  id: HomePathId;
  /** כותרת-המצב (מהכרטיס) — עולה לכותרת-הבמה בהמשכיות-אלמנט. */
  title: string;
  /** העובדה — מה שקרה בפועל (מתוך factStory.moments). */
  fact: string;
  /** הסיפור — מה שהראש הוסיף (מתוך factStory.stories). */
  story: string;
  /** משפט-הגשר לאחר ההבנה (pullQuote של התחנה). */
  bridge: string;
  /** קישור לעמוד-התחנה הייעודי. */
  stationHref: string;
  /** תווית הקישור לעמוד-התחנה. */
  stationLabel: string;
}

/**
 * מיפוי מצב→תחנה→זוג עובדה/סיפור. הזוגות נבחרו מתוך המאגרים המאושרים לפי
 * הקִרבה התמטית של הרגע למצב (בלי ליצור טקסט חדש):
 */
const COMPOSITION: Record<HomePathId, { journey: JourneyId; fact: string; story: string }> = {
  // מחפש/ת קשר: דייט שנדחה → „איבד/ה עניין”.
  dating: { journey: "before-relationship", fact: "postponed", story: "כנראה איבד/ה בי עניין" },
  // תחילת קשר: הקצב איטי מהמצופה → „זה עומד להיגמר”.
  building: { journey: "building-relationship", fact: "slower", story: "זה עומד להיגמר" },
  // בתוך קשר: הטון קריר → „לא באמת אכפת”.
  existing: { journey: "inside-relationship", fact: "cooler", story: "כנראה שלא באמת אכפת לו/לה" },
  // אחרי פרידה: שקט/אי-מענה → „עשיתי משהו לא בסדר”.
  breakup: { journey: "after-breakup", fact: "silence", story: "בטח עשיתי משהו לא בסדר" },
};

export const focusSituations: FocusSituation[] = homePaths.map((p) => {
  const c = COMPOSITION[p.id];
  return {
    id: p.id,
    title: p.buttonTitle,
    fact: momentFact(c.fact),
    story: story(c.story),
    bridge: journeyPages[c.journey].pullQuote,
    stationHref: p.stationHref,
    stationLabel: p.stationLabel,
  };
});

export function getFocusSituation(id: HomePathId): FocusSituation {
  const s = focusSituations.find((x) => x.id === id);
  if (!s) throw new Error(`focusMode: unknown situation "${id}"`);
  return s;
}

/**
 * תוויות הממשק של Focus Mode. כולן מסגרת-ניווט/הכוונה — נשענות על שמות-השדות
 * של הכלי (factTag/storyTag/separationLine) כדי לשמור אמת מול הספר.
 */
export const focusUi = {
  /** קיקר של הבמה (מתוך ה-lab). */
  eyebrow: lab.eyebrow, // „נסו על רגע אחד”
  /** aria-label של אזור-הבמה. */
  regionLabel: "רגע אחד — עובדה מול סיפור",
  /** משפט-המסגור של הבמה (מתוך ה-lab) — „ניקח רגע אחד, ונפריד יחד”. */
  intro: lab.intro,
  /** תווית נתיב-העובדה (מתוך ה-lab). */
  factTag: lab.factTag, // „מה שקרה”
  /** תווית נתיב-הסיפור (מתוך ה-lab). */
  storyTag: lab.storyTag, // „מה שהוספתם”
  /** שאלת-הסיפור מעל נתיב-הסיפור (מתוך ה-lab). */
  storyPrompt: lab.storyPrompt, // „ומה הראש כבר סיפר על זה?”
  /** ה-Aha: כותרת-הממשק הקצרה (headline, לא ציטוט מהספר ולא כלי חדש). */
  ahaHeadline: "אלה לא אותו דבר.",
  /** ה-Aha: ההסבר הקנוני מתחת לכותרת — משפט-ההפרדה (מתוך ה-lab). */
  separationLine: lab.separationLine,
  /** מסגור שלב-הפעולה (מתוך ה-lab) — כותרת ולֶד. */
  actionEyebrow: lab.actionEyebrow, // „פעולה”
  actionIntro: lab.actionIntro, // „עכשיו, כשהעובדה עומדת לבדה…”
  /** הכפתור שמפעיל את ה-Aha — הפרדה יזומה של הקורא. */
  separateLabel: "הפרידו: מה מזה באמת קרה?",
  /** ה-CTA הראשי שנחשף אחרי ההבנה — ממשיך לשיחה עם הספר. */
  continueLabel: "המשיכו עם הספר",
  /** חזרה לבחירת-המצב. */
  backLabel: "חזרה למצבים",
  // ── תוויות-ממשק לפעימות (chrome, לא תוכן מהספר) ──
  /** כניסה→פיצול: מזמין להביט ברגע אחד ולהפריד אותו. */
  enterCta: "נפריד רגע",
  /** Aha→פעולה: מעבר שקט אל שלב-הפעולה הנקי. */
  ahaCta: "המשך",
} as const;
