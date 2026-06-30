/**
 * Guardrails — שמירה על תשובות בגבול הספר.
 * 1. Input safety filter — מזהה סיגנלים של סכנה לפני שליחה ל-AI.
 * 2. Output validation — מוודא שהתשובה לא חרגה.
 */

// סיגנלים של סכנה — חוסם את הזרימה הרגילה ומחזיר תשובת בטיחות מובנית.
const SAFETY_PATTERNS: { pattern: RegExp; type: string }[] = [
  { pattern: /(אלימות|מכות|מכה אותי|פיזית פוגע|הרבץ)/, type: "violence" },
  { pattern: /(מאיים|איים|איום)/, type: "threat" },
  { pattern: /(שולט בי|שליטה|לא נותן לי|אסור לי)/, type: "control" },
  { pattern: /(בידוד|בודד אותי|לא נותן לחברים)/, type: "isolation" },
  { pattern: /(להתאבד|אתאבד|לא רוצה לחיות|לסיים את הכול)/, type: "self-harm" },
  { pattern: /(אונס|אנס|כפייה מינית|כפה עליי)/, type: "sexual-coercion" },
  { pattern: /(עוקב אחריי|מעקב|כל הזמן בודק איפה אני)/, type: "stalking" },
];

export interface SafetyResult {
  triggered: boolean;
  type?: string;
}

export function detectSafety(text: string): SafetyResult {
  for (const { pattern, type } of SAFETY_PATTERNS) {
    if (pattern.test(text)) return { triggered: true, type };
  }
  return { triggered: false };
}

export const SAFETY_RESPONSE = {
  facts:
    "מה שתיארת נשמע כבד יותר ממה שהאפליקציה הזאת בנויה לעזור איתו, ואני רוצה לעצור כאן ולהיות איתך ישיר.",
  story:
    "אתה לא צריך להתמודד עם זה לבד. האפליקציה היא ספר אינטראקטיבי — היא לא תחליף לעזרה מקצועית או בטיחותית כשמשהו אמיתי קורה.",
  nextAction:
    "פנה עכשיו לאדם בטוח: רופא משפחה, קופת חולים, שירותי הרווחה, או מרכז סיוע מוכר. עברו למסך הבטיחות באפליקציה — שם יש פירוט.",
};

// ביטויים שהמודל אסור להגיד — אם הם עברו, נחתוך אותם.
const FORBIDDEN_PHRASES = [
  /אבחנה רפואית/i,
  /אתה סובל מ-?(?:הפרעה|דיכאון|חרדה כללית)/i,
  /אתה צריך להיפרד/i,
  /הוא נרקיסיסט/i,
  /היא נרקיסיסטית/i,
  /סוציופת/i,
  /פסיכופת/i,
];

export function isOutputClean(text: string): boolean {
  return !FORBIDDEN_PHRASES.some((p) => p.test(text));
}

export function fallbackResponse(): {
  facts: string;
  story: string;
  nextAction: string;
} {
  return {
    facts: "שמעתי אותך, אבל יש משהו במה שעלה עכשיו שדורש להאט.",
    story:
      "המאמן עונה רק לפי הספר, ובמקרה הזה הספר עצמו מבקש שלא ניתן תשובה מהירה. שווה לעצור.",
    nextAction:
      "פתח את הכלי 'משולש העובדה' או את 'מי אוחז בהגה' — שניהם עוזרים בדיוק ברגעים כאלה.",
  };
}
