import type { AskStationId } from "@/content/askRoute";

/**
 * ארבעת „שערי-המסע” של „מדייטים לאהבה”. כל אחת מארבע הבחירות ב„איפה זה פוגש
 * אותך עכשיו?” היא ניווט לעמוד-מסע ייעודי — Landing אישי, לא כרטיס שנפתח בבית.
 * מבנה UX עקבי (Hero → שיקוף → 3 נושאים → טעימה מותאמת → „שאל את הספר” → מה
 * לקרוא מכאן → עדכון השקה), אך כל עמוד נכתב לשפת-המצב שלו.
 *
 * הקטע האמיתי מהספר אינו נכתב כאן: הפעולה הראשית מובילה ל-`/preview?tool=&station=`
 * (תשתית קיימת) שמציג קטע מהתוכן המאושר של הכלי הקרוב-ביותר למצב. אין להמציא
 * קטעים. „אחרי פרידה” משתמש ב-personaExamples.breakup של הכלי (מיושם ב-Preview).
 *
 * מטא-דאטה (title/description/canonical) נשארת מקור-אמת יחיד ב-stations.ts —
 * העמודים כאן משנים את הגוף בלבד, כדי לא ליצור כפילויות SEO.
 */

export type JourneyId =
  | "before-relationship"
  | "building-relationship"
  | "inside-relationship"
  | "after-breakup";

export interface JourneyPage {
  id: JourneyId;
  /** תווית קצרה (פירורי-לחם + kicker). */
  eyebrow: string;
  /** כותרת-על אישית למצב. */
  h1: string;
  /** פסקת שיקוף אחת — „האתר הבין אותי”. */
  intro: string;
  /** שורת-מצב-רוח קצרה (מסך ראשון) — הטון הרגשי הייחודי של המסלול. */
  moodLine: string;
  /** כותרת מקטע הנושאים — מנוסחת לשפת-המצב (לא כותרת גנרית). */
  topicsHeading: string;
  /** שלושה נושאים מרכזיים (ביטויים קצרים, מאושרים). */
  topics: [string, string, string];
  /** משפט-מעבר קצר לטעימה — מסגר את נושא הכלי (התוכן המאושר), לא ממציא קטע. */
  sampleLead: string;
  /** הכלי המאושר שהטעימה נגזרת ממנו (Preview). */
  sampleTool: string;
  /** ה-station שמועבר ל-Preview (= slug העמוד). */
  sampleStation: JourneyId;
  /** תווית הפעולה הראשית — טעימה מותאמת. */
  samplePrimaryLabel: string;
  /** התחנה המקבילה במנוע „שאל את הספר” — כדי לא לשאול שוב „איפה אתם?”. */
  compassStation: AskStationId;
  /** צעד-המשך עדין (רק „אחרי פרידה” → „מתחילים מחדש”), לא CTA ראשי. */
  nextStep?: { prompt: string; href: string; label: string };
}

export const journeyPages: Record<JourneyId, JourneyPage> = {
  "before-relationship": {
    id: "before-relationship",
    eyebrow: "לפני קשר",
    h1: "לפני שבוחרים מישהו, כדאי להבין איך אתם בוחרים.",
    intro:
      "לפעמים הקושי אינו למצוא מישהו — אלא להבין למה דווקא אנשים מסוימים מושכים אותנו, למה אנחנו פוסלים מהר, ומה אנחנו באמת צריכים מקשר.",
    moodLine: "רגע של בהירות — עוד לפני הדייט הבא.",
    topicsHeading: "מה כדאי לברר עם עצמכם",
    topics: [
      "משיכה מול התאמה",
      "דפוסים שחוזרים בבחירה",
      "דייטים בלי להפוך אותם לאודישן",
    ],
    sampleLead:
      "קטע קצר מהספר על ההבדל בין הסיפור שהמוח בונה לבין מה שקורה באמת:",
    sampleTool: "fact-story-action",
    sampleStation: "before-relationship",
    samplePrimaryLabel: "קראו טעימה שמתאימה לשלב הזה",
    compassStation: "dating",
  },
  "building-relationship": {
    id: "building-relationship",
    eyebrow: "מתחילים קשר",
    h1: "כשהקשר מתחיל להיות אמיתי, גם השאלות משתנות.",
    intro:
      "כימיה יכולה לפתוח את הדלת. עכשיו מתחילים לפגוש קצב, ציפיות, בלעדיות והפער שבין מה שאומרים למה שעושים.",
    moodLine: "מהתרגשות ראשונה — לתנועה מכוונת.",
    topicsHeading: "מה מתחיל להיפגש עכשיו",
    topics: [
      "קצב שמתאים לשניכם",
      "חום־קור ומילים מול מעשים",
      "ציפיות ובלעדיות",
    ],
    sampleLead:
      "קטע קצר מהספר על בניית קרבה — שכבה על שכבה, לא במכה אחת:",
    sampleTool: "gate-questions",
    sampleStation: "building-relationship",
    samplePrimaryLabel: "קראו טעימה שמתאימה לקשר שמתחיל",
    compassStation: "building",
  },
  "inside-relationship": {
    id: "inside-relationship",
    eyebrow: "בתוך קשר",
    h1: "קשר טוב לא נשמר מעצמו. הוא נבנה שוב ושוב.",
    intro:
      "גם קשר שיש בו אהבה יכול לפגוש ריחוק, שגרה וריבים שחוזרים. השאלה היא לא רק מה התקלקל — אלא מה אפשר להתחיל לעשות אחרת.",
    moodLine: "לא להתחיל מחדש — להעמיק ולתקן את מה שכבר יש.",
    topicsHeading: "מה אפשר להתחיל לעשות אחרת",
    topics: [
      "מה נמצא מתחת לריב החוזר",
      "לבקש קרבה בלי האשמה",
      "להחזיר לקשר נוכחות והרגלים שמחזיקים „אנחנו”",
    ],
    sampleLead:
      "קטע קצר מהספר על לומר מה חשוב לכם — ברוגע, ובלי האשמה:",
    sampleTool: "twenty-maintenance",
    sampleStation: "inside-relationship",
    samplePrimaryLabel: "קראו טעימה שמתאימה לקשר קיים",
    compassStation: "existing",
  },
  "after-breakup": {
    id: "after-breakup",
    eyebrow: "אחרי פרידה",
    h1: "לא צריך לדעת כבר עכשיו מה הצעד הבא.",
    intro:
      "פרידה לא מסתיימת ברגע שהקשר נגמר. לפעמים נשארים געגוע, שאלות ורצון להבין מה היה — לפני שמחליטים אם להביט לאחור או להתחיל מחדש.",
    moodLine: "בלי למהר לשום כיוון. קודם מקום לעצור ולהבין.",
    topicsHeading: "מה כדאי לתת לו מקום",
    topics: [
      "געגוע לאדם מול געגוע למה שהקשר הבטיח",
      "רצון לחזור מול פחד מהבדידות",
      "מתי לעצור ולעבד ומתי מתחיל להיפתח מקום לחדש",
    ],
    sampleLead:
      "קטע קצר מהספר על שקט שמתחזה להוכחה — ואיך מפרידים ביניהם:",
    sampleTool: "quiet-check",
    sampleStation: "after-breakup",
    samplePrimaryLabel: "קראו טעימה שמתאימה למה שאתם עוברים עכשיו",
    compassStation: "after-breakup",
    nextStep: {
      prompt: "מרגישים שכבר מתחיל להיפתח מקום לחדש?",
      href: "/starting-again",
      label: "מתחילים מחדש",
    },
  },
};
