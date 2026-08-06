/**
 * ארבע הפרסונות של „מדייטים לאהבה”. אותו שורש בעיה (דפוסים לא-מודעים + היקשרות),
 * ארבעה עולמות שונים שאי אפשר לדבר אליהם באותה שפה. „אחרי פרידה” ו„גרוש/ה — פרק
 * ב'” הם *שני* עולמות נפרדים בכוונה.
 *
 * הבחירה נשמרת מקומית (PersonaProvider) ומתאימה את הקופי, ה-CTA והבר הדביק לאורך
 * האתר. אין המלצות-דמה כאן — מבנה ההמלצות המפולח נדלק רק כשיש אמיתיות.
 */

/** מקור-אמת יחיד למזהי הפרסונות (טאפל — לשימוש זוד/ולידציה בשרת). */
export const PERSONA_IDS = ["single", "breakup", "divorced", "married"] as const;

export type PersonaId = (typeof PERSONA_IDS)[number];

/** מקורות-הבחירה (טאפל — לוולידציה בשרת). */
export const PERSONA_SOURCE_VALUES = [
  "hero",
  "section",
  "url",
  "stored",
  "none",
] as const;

/**
 * מאיפה הגיעה בחירת-הפרסונה — לשיוך רשומות רשימת-ההמתנה:
 *  hero    — הפילים בראש העמוד
 *  section — כרטיסי „אותו קוד — ארבעה עולמות”
 *  url     — פרמטר ?persona= (כניסה ממודעה/פוסט ייעודי)
 *  stored  — נטען מ-localStorage מביקור קודם (מקור מקורי לא ידוע)
 *  none    — לא נבחרה פרסונה
 */
export type PersonaSource = (typeof PERSONA_SOURCE_VALUES)[number];

export type Persona = {
  id: PersonaId;
  /** תווית קצרה לכפתור-הפילוח (Pill). */
  pill: string;
  /** כותרת הכרטיס ב„למי הספר”. */
  cardTitle: string;
  /** הכאב האמיתי — ציטוט פנימי, בגוף ראשון. */
  pain: string;
  /** „מה היא רוצה לשמוע” — כותרת-משנה מותאמת ל-Hero. */
  hook: string;
  /** תווית ה-CTA הדינמי. */
  ctaLabel: string;
  /** יעד ה-CTA (טרום-השקה: רשימת ההמתנה — המרת-המאקרו). */
  ctaHref: string;
};

export const PERSONA_STORAGE_KEY = "mlc.persona.v1";
/** מקור-הבחירה נשמר בנפרד מהמזהה (המזהה נשאר סלוג נקי לסקריפט הקדם-צביעה). */
export const PERSONA_SOURCE_STORAGE_KEY = "mlc.persona.src.v1";
/** ה-slug ב-URL: ?persona=single|breakup|divorced|married. */
export const PERSONA_QUERY_PARAM = "persona";

export const personas: readonly Persona[] = [
  {
    id: "single",
    pill: "רווק/ה",
    cardTitle: "רווק/ה שחוק/ה",
    pain: "„למה אני תמיד נמשך/ת לאותו דפוס?”",
    hook: "יש קוד — וזה לא אשמתך. שוב ושוב נמשכים לאותו טיפוס כי דפוס לא-מודע עובד ברקע. הספר מראה איך לזהות אותו ולשבור את הלופ.",
    ctaLabel: "אני רוצה סוף סוף קשר בטוח",
    ctaHref: "/waitlist",
  },
  {
    id: "breakup",
    pill: "אחרי פרידה",
    cardTitle: "אחרי פרידה / לב שבור",
    pain: "„איך לא ראיתי את זה? מה לא בסדר בי?”",
    hook: "לפני שקופצים הלאה — כדאי להבין מה באמת קרה. הספר עוזר לסגור את המעגל, להחלים נכון, ולא לשחזר את אותה טעות בפעם הבאה.",
    ctaLabel: "אני רוצה להבין ולהחלים נכון",
    ctaHref: "/waitlist",
  },
  {
    id: "divorced",
    pill: "גרוש/ה · פרק ב'",
    cardTitle: "גרוש/ה — פרק ב'",
    pain: "„אני מפחד/ת לשחזר את אותו סיפור לילדים שלי.”",
    hook: "אפשר להיכנס לפרק ב' נקי/ה יותר — בלי לגרור את המטענים מהעבר, ולבנות הפעם קשר בריא, גם בשביל הילדים.",
    ctaLabel: "אני רוצה פרק ב' בריא",
    ctaHref: "/waitlist",
  },
  {
    id: "married",
    pill: "בזוגיות",
    cardTitle: "נשוי/אה — בזוגיות",
    pain: "„אנחנו אוהבים — אבל הבית הפך לרכבת הרים.”",
    hook: "לא לפרק — לחזור הביתה. הספר מראה איך לעצור את הריקוד החרדתי-נמנע שהפך את הבית לרכבת הרים, ולבנות מחדש קרבה.",
    ctaLabel: "אנחנו רוצים לחזור הביתה",
    ctaHref: "/waitlist",
  },
] as const;

export function getPersona(id: PersonaId | null | undefined): Persona | undefined {
  return id ? personas.find((p) => p.id === id) : undefined;
}

export function isPersonaId(v: unknown): v is PersonaId {
  return typeof v === "string" && (PERSONA_IDS as readonly string[]).includes(v);
}

export function isPersonaSource(v: unknown): v is PersonaSource {
  return (
    typeof v === "string" &&
    (PERSONA_SOURCE_VALUES as readonly string[]).includes(v)
  );
}

/** מפת ה-hooks (כותרות-משנה) לפי מזהה — לשימוש סקריפט הקדם-צביעה. */
export function personaHooks(): Record<PersonaId, string> {
  return personas.reduce(
    (acc, p) => {
      acc[p.id] = p.hook;
      return acc;
    },
    {} as Record<PersonaId, string>
  );
}
