/**
 * ארבע הפרסונות של „מדייטים לאהבה”. אותו שורש בעיה (דפוסים לא-מודעים + היקשרות),
 * ארבעה עולמות שונים שאי אפשר לדבר אליהם באותה שפה. „אחרי פרידה” ו„גרוש/ה — פרק
 * ב'” הם *שני* עולמות נפרדים בכוונה.
 *
 * הבחירה נשמרת מקומית (PersonaProvider) ומתאימה את הקופי, ה-CTA והבר הדביק לאורך
 * האתר. אין המלצות-דמה כאן — מבנה ההמלצות המפולח נדלק רק כשיש אמיתיות.
 */

export type PersonaId = "single" | "breakup" | "divorced" | "married";

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
  return typeof v === "string" && personas.some((p) => p.id === v);
}
