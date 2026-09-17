import { guides } from "@/content/guides";

/**
 * אינדקס המדריכים — הארגון האנושי של אשכול התוכן.
 *
 * עשרים ושלושה מדריכים ללא עמוד-אב הם בעיה כפולה: הקורא אינו יכול לגלות אותם
 * (הם לא בתפריט, והדרך היחידה אליהם היא דרך עמוד-מסע או מדריך אחר), והזחלן
 * מגיע אליהם רק בקפיצות. אבל רשימה שטוחה של עשרים ושלושה קישורים אינה פתרון
 * אלא בעיה אחרת — היא לא מלמדת כלום על הסדר שביניהם.
 *
 * לכן הארגון כאן הוא לפי *המסע עצמו*, אותו מסע שהאתר כולו בנוי סביבו:
 * דייטים והיכרות → בניית קשר → בתוך זוגיות → פרידה והתחלה מחדש. כל שלב נושא
 * משפט שמסביר מתי הוא רלוונטי, כך שהקורא יכול למצוא את עצמו לפי מצב ולא לפי
 * כותרת. המיפוי מפורש ולא נגזר אוטומטית: מדריך אינו שייך לשלב בגלל ה-hub שלו
 * אלא בגלל מתי באמת קוראים אותו.
 *
 * מקור האמת לכותרות ולתיאורים נשאר `guides.ts` — כאן יושב רק הסדר.
 */

/**
 * תחנה בציר-המסע — הנכס העריכתי של /guide.
 *
 * זהו *לא* אותו דבר כמו `GuideStage` שמתחתיו, וההפרדה מכוונת:
 *
 *   • `journey` (כאן) הוא המסע כפי שהאתר כולו מתאר אותו, חמש תחנות מדייטים
 *     ועד אהבה. הוא כולל את „אהבה”, שאין לה מדריכים משלה אלא עמוד-אב (/love),
 *     ולכן היא אינה יכולה להיות קבוצה בספרייה.
 *   • `guideStages` הוא הספרייה: ארבע קבוצות שכל אחת מחזיקה מדריכים בפועל.
 *
 * ניסיון לדחוס את שניהם למבנה אחד היה מאלץ אותי או להמציא ל„אהבה” מדריכים
 * שאינם שלה, או להשמיט אותה מהמסע. שניהם היו משקרים על המבנה.
 *
 * כל תחנה נושאת את *האתגר* שלה, לא רק תיאור: זה מה שמאפשר לקורא לזהות איפה
 * הוא נמצא. אדם לא יודע לומר „אני בשלב בניית קשר”, אבל הוא בהחלט מזהה את
 * „כבר לא סתם יוצאים, עדיין לא ביחד”.
 */
export interface JourneyStation {
  id: string;
  /** שם התחנה, כפי שהאתר קורא לה. */
  name: string;
  /** מה קורה כאן, במשפט. */
  what: string;
  /** האתגר המרכזי של השלב — המשפט שבו הקורא אמור לזהות את עצמו. */
  challenge: string;
  /** עמוד-האב של השלב. */
  href: string;
  /** מאיפה להתחיל לקרוא כשמזהים את עצמכם כאן. */
  start?: { href: string; label: string };
}

export interface GuideStage {
  id: string;
  /** H2 של השלב. */
  title: string;
  /** מתי השלב הזה רלוונטי — משפט אחד, בגובה העיניים. */
  lead: string;
  /** עמוד-האם של השלב (אשכול/תחנה), כשקיים. */
  hub?: { href: string; label: string };
  /**
   * המדריך החזק ביותר להתחיל ממנו בקבוצה הזו. לא „הראשון ברשימה”: זה המדריך
   * שעונה על השאלה שהכי הרבה אנשים מגיעים איתה לשלב, ולכן הוא מסומן במפורש
   * במקום להשאיר את הקורא לבחור מתוך שש כותרות דומות.
   */
  startWith?: string;
  slugs: string[];
}

export const guideIndexMeta = {
  title: "מדריכים: דייטים, קשר וזוגיות",
  description:
    "כל המדריכים של „מדייטים לאהבה” לפי שלבי המסע: דייטים והיכרות, בניית קשר, זוגיות קיימת, ופרידה והתחלה מחדש. מאת צחי חן.",
  kicker: "מדריכים",
  h1: "כל המדריכים",
  lead:
    "המדריכים כאן מסודרים לפי המסע עצמו, מהפגישה הראשונה ועד לקשר שנבנה לאורך זמן. אפשר לקרוא לפי הסדר, ואפשר פשוט למצוא את השלב שאתם נמצאים בו עכשיו.",
  byline: {
    prefix: "מאת",
    name: "צחי חן",
    role: "מחבר „מדייטים לאהבה”",
    href: "/author",
  },
  close: {
    title: "המדריכים הם הצצה. הספר הוא השיטה המלאה",
    body:
      "כל מדריך כאן עומד בפני עצמו ועונה על שאלה אחת. „מדייטים לאהבה” הוא מה שמחזיק אותם יחד: לא אוסף עצות לפי מצב, אלא דרך אחת שממשיכה מהפגישה הראשונה אל הקשר שנבנה אחריה.",
    cta: "לעמוד הספר",
    href: "/book",
    // קצה המסע. ארבעת השלבים למעלה מתארים מה עושים בכל נקודה; /love הוא עמוד-
    // הסמכות של מה שכל זה מוביל אליו, והוא סוגר את הקשת דייטים → אהבה שהאתר
    // כולו בנוי עליה. קישור אחד, במקום שבו הוא באמת נקרא.
    secondary: {
      href: "/love",
      label: "ולאן כל זה מוביל: מהי אהבה, ואיך היא נבנית",
    },
  },
} as const;

export const journeyMeta = {
  title: "המסע, מקצה לקצה",
  lead:
    "כל מה שכתוב באתר יושב על קשת אחת: מהפגישה הראשונה ועד לאהבה שנבנית לאורך זמן. חמש התחנות כאן הן אותה קשת. מצאו את המשפט שנשמע כמו מה שקורה אצלכם עכשיו, והתחילו משם.",
  // „פרידה” אינה תחנה שישית בקשת, כי היא אינה מה שבא אחרי אהבה. היא ענף שיכול
  // לצאת מכל אחת מהתחנות, ולכן היא נאמרת כאן במפורש ולא נדחסת לתוך הרצף.
  aside:
    "ולא כל סיפור עובר את כל הקשת. כשקשר נגמר, בכל אחת מהתחנות, יש לזה מקום משלו:",
  asideLink: { href: "/after-breakup", label: "אחרי פרידה: לעבד, ורק אז להחליט" },
} as const;

export const journey: JourneyStation[] = [
  {
    id: "dating",
    name: "דייטים",
    what: "פוגשים אנשים, בודקים, ומחליטים עם מי שווה להמשיך.",
    challenge: "כל פגישה הופכת למבחן, והחיפוש עצמו מתחיל להתיש.",
    href: "/dating",
    start: { href: "/guide/first-date", label: "דייט ראשון: על מה מדברים" },
  },
  {
    id: "getting-to-know",
    name: "היכרות",
    what: "כבר נפגשתם כמה פעמים, ומתחילים לראות מי האדם הזה כשהוא לא משתדל.",
    challenge: "נעים, אבל שום דבר לא מתקדם, וקשה להבין למה.",
    href: "/before-relationship",
    start: {
      href: "/guide/dates-not-progressing",
      label: "למה הדייטים לא מתקדמים",
    },
  },
  {
    id: "building",
    name: "בניית קשר",
    what: "נוצרת רציפות, והחיפוש מתחלף בבנייה.",
    challenge: "נפגשים בקביעות, אבל אף אחד עוד לא אמר בקול לאן זה הולך.",
    href: "/building-relationship",
    start: {
      href: "/guide/from-dating-to-relationship",
      label: "איך עוברים מדייטים לקשר",
    },
  },
  {
    id: "relationship",
    name: "זוגיות",
    what: "קשר קיים, עם שגרה, מריבות חוזרות ודברים שצריך לתקן.",
    challenge: "הקרבה נדחקת הצידה בשקט, בלי שאף אחד החליט על כך.",
    href: "/inside-relationship",
    start: {
      href: "/guide/healthy-relationship",
      label: "מהי מערכת יחסים בריאה",
    },
  },
  {
    id: "love",
    name: "אהבה",
    what: "מה שנשאר אחרי שההתלהבות נרגעת: בחירה חוזרת, הדדיות ויכולת לתקן.",
    challenge: "מחכים שהתחושה תכריע, במקום לתת לקשר זמן להראות מה יש בו.",
    href: "/love",
  },
];

export const guideStages: GuideStage[] = [
  {
    id: "dating",
    title: "דייטים והיכרות",
    startWith: "first-date",
    lead: "השלב שבו פוגשים, בודקים, ומנסים להבין אם יש כאן משהו להמשיך איתו.",
    hub: { href: "/dating", label: "דייטים: מה באמת קורה בשלב ההיכרות" },
    slugs: [
      "first-date",
      "dates-not-progressing",
      "finding-a-relationship",
      "dating-red-flags",
      "attracted-to-unavailable",
      "ready-for-a-relationship",
    ],
  },
  {
    id: "building",
    title: "בניית קשר",
    startWith: "from-dating-to-relationship",
    lead: "כשכבר יש עם מי, והשאלה היא איך זה הופך למשהו יציב.",
    hub: {
      href: "/building-relationship",
      label: "בניית קשר: כשהקשר מתחיל להיות אמיתי",
    },
    slugs: [
      "from-dating-to-relationship",
      "defining-the-relationship",
      "how-fast-is-too-fast",
      "choosing-a-partner",
      "compatibility",
      "hot-and-cold",
      "words-vs-actions",
      "fear-of-commitment",
    ],
  },
  {
    id: "inside",
    title: "בתוך זוגיות",
    startWith: "healthy-relationship",
    lead: "קשר קיים: מה שומר עליו, מה שוחק אותו, ואיך חוזרים זה אל זה.",
    hub: {
      href: "/inside-relationship",
      label: "בתוך קשר: להעמיק ולבנות מחדש",
    },
    slugs: [
      "healthy-relationship",
      "couple-communication",
      "keeping-connection-alive",
      "recurring-fights",
      "attachment-styles",
      "relationship-doubts",
    ],
  },
  {
    id: "endings",
    title: "פרידה והתחלה מחדש",
    startWith: "over-a-breakup",
    lead: "כשקשר נגמר, או כשחוזרים אחריו אל העולם בפעם השנייה.",
    hub: { href: "/after-breakup", label: "אחרי פרידה: לעבד, ורק אז להחליט" },
    slugs: [
      "how-to-end-a-relationship",
      "over-a-breakup",
      "getting-back-with-ex",
    ],
  },
];

/**
 * שער-בטיחות: כל מדריך חייב להופיע בדיוק פעם אחת באינדקס. בלי זה, מדריך חדש
 * שנוסף ל-`guides.ts` היה נעלם מהאינדקס בשקט — בדיוק סוג הבאג שלא מתגלה עד
 * שמישהו שואל למה עמוד לא מקבל תנועה.
 */
export function auditGuideIndex(): { missing: string[]; duplicated: string[] } {
  const listed = guideStages.flatMap((s) => s.slugs);
  const seen = new Set<string>();
  const duplicated: string[] = [];
  for (const slug of listed) {
    if (seen.has(slug)) duplicated.push(slug);
    seen.add(slug);
  }
  const missing = Object.keys(guides).filter((slug) => !seen.has(slug));
  return { missing, duplicated };
}
